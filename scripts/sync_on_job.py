"""
TowBook → Supabase On-Job Sync
Runs every 5 minutes via GitHub Actions.

Scrapes the Current and Active dispatch tabs in TowBook, collects every truck
name listed on a call, and flips trucks.on_job in Supabase:
  - on_job = TRUE  where towbook_name matches a name found on a live call
  - on_job = FALSE for all other trucks (cleared when job ends)

Matching is case-insensitive and trims whitespace.
"""

import os, re, time
from playwright.sync_api import sync_playwright
from supabase import create_client

TOWBOOK_USER  = os.environ["TOWBOOK_USER"]
TOWBOOK_PASS  = os.environ["TOWBOOK_PASS"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]   # service role — bypasses RLS

DISPATCH_URL  = "https://app.towbook.com/DS4"

# Only these tabs indicate a truck is actively dispatched right now.
# Scheduled calls are not counted — the truck hasn't left yet.
ACTIVE_TABS = [
    ("Current", "#atCurrent"),
    ("Active",  "#atActive"),
]

sb = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_truck_names(page, tab_name, tab_id):
    """Click a dispatch tab and collect every non-empty Truck field value."""
    names = set()

    page.locator(tab_id).click()
    page.wait_for_timeout(1_500)

    rows = [r for r in page.locator("li.entryRow").all() if r.is_visible()]
    print(f"  {tab_name}: {len(rows)} rows")

    for row in rows:
        # Primary: labelled Truck field inside ul.details1
        truck = ''
        for li in row.locator("ul.details1 > li").all():
            title_el = li.locator(".title")
            text_el  = li.locator(".text")
            if not title_el.count() or not text_el.count():
                continue
            if (title_el.first.text_content() or '').strip() == 'Truck':
                truck = (text_el.first.get_attribute("title") or
                         text_el.first.text_content() or '').strip()
                break

        # Fallback: equipment column (columnid=6)
        if not truck:
            eq_el = row.locator(".text[columnid='6']")
            if eq_el.count():
                truck = (eq_el.first.get_attribute("title") or
                         eq_el.first.text_content() or '').strip()

        truck = re.sub(r'\s+', ' ', truck).strip()
        if truck:
            names.add(truck)

    return names


def scrape_active_trucks():
    """Log into TowBook and return the set of truck names on live calls."""
    active_trucks = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page    = browser.new_context().new_page()

        print("Logging into TowBook...")
        page.goto("https://app.towbook.com/Security/Login.aspx")
        page.wait_for_selector("#Username", timeout=20_000)
        page.evaluate(f'document.getElementById("Username").value = "{TOWBOOK_USER}"')
        page.evaluate(f'document.getElementById("Password").value = "{TOWBOOK_PASS}"')
        page.locator('button[name="bSignIn"]').click()
        page.wait_for_url(lambda url: "Login" not in url, timeout=30_000)

        print(f"Navigating to {DISPATCH_URL}...")
        page.goto(DISPATCH_URL)
        page.wait_for_load_state("load", timeout=30_000)

        try:
            page.wait_for_selector("#atCurrent", timeout=15_000)
        except Exception:
            print("Dispatch tab bar not found — aborting.")
            browser.close()
            return active_trucks

        for tab_name, tab_id in ACTIVE_TABS:
            try:
                names = extract_truck_names(page, tab_name, tab_id)
                active_trucks |= names
            except Exception as e:
                print(f"  Warning: failed to scrape {tab_name} tab — {e}")

        browser.close()

    print(f"Active truck names from TowBook: {active_trucks}")
    return active_trucks


def sync_on_job(active_truck_names):
    """Update trucks.on_job in Supabase based on live TowBook names."""

    # Normalize to lowercase for matching
    active_lower = {n.lower() for n in active_truck_names}

    # Load all trucks that have a towbook_name set
    resp = sb.from_("trucks") \
             .select("id, unit_number, towbook_name, on_job") \
             .not_.is_("towbook_name", "null") \
             .execute()

    trucks = resp.data or []
    print(f"Loaded {len(trucks)} trucks with a towbook_name")

    on_job_ids  = []
    off_job_ids = []

    for t in trucks:
        if not t.get("towbook_name"):
            continue
        matched = t["towbook_name"].lower() in active_lower
        if matched:
            on_job_ids.append(t["id"])
            print(f"  ON JOB:  {t['unit_number']} ({t['towbook_name']})")
        elif t.get("on_job"):
            off_job_ids.append(t["id"])
            print(f"  OFF JOB: {t['unit_number']} ({t['towbook_name']})")

    if on_job_ids:
        sb.from_("trucks").update({"on_job": True}).in_("id", on_job_ids).execute()
    if off_job_ids:
        sb.from_("trucks").update({"on_job": False}).in_("id", off_job_ids).execute()

    from datetime import datetime, timezone
    sb.from_("settings").upsert(
        {"key": "last_synced_on_job", "value": datetime.now(timezone.utc).isoformat()},
        on_conflict="key"
    ).execute()

    print(f"Set on_job=true for {len(on_job_ids)} trucks, cleared {len(off_job_ids)} trucks")


def main():
    from datetime import datetime, timezone
    print(f"[{datetime.now(timezone.utc).isoformat()}Z] Starting on-job sync")
    active = scrape_active_trucks()
    sync_on_job(active)
    print("Done.")


if __name__ == "__main__":
    main()
