"""Exercise the guest warning sequence against a served VELYQUA web build."""
import sys
from datetime import datetime, timedelta, timezone

from playwright.sync_api import expect, sync_playwright


def verify(browser, url):
    context = browser.new_context(timezone_id="UTC")
    page = context.new_page()
    page.goto(url)
    today = datetime.now(timezone.utc).date()
    dates = [str(today - timedelta(days=offset)) for offset in (2, 1)]

    def start():
        page.get_by_role("button", name="Record an observation").click()

    def save():
        page.get_by_text("Save update", exact=True).click()
        expect(page.get_by_text("Quick Update", exact=True)).to_be_hidden()

    def water(parameter, value):
        start()
        page.get_by_text(parameter, exact=True).last.click()
        if value is None:
            page.get_by_role("checkbox", name="I can’t tell").click()
        else:
            page.get_by_label("Water test value").fill(value)
        save()

    def visible(text):
        expect(page.get_by_text(text, exact=True).first).to_be_visible()

    water("ammonia", "0")
    water("nitrate", "10")
    water("nitrite", "0")
    visible("ALL CLEAR")
    for day in dates:
        start()
        page.get_by_text("Care or note", exact=True).click()
        page.get_by_text("body condition", exact=True).last.click()
        page.get_by_label("Fish or group identifier").fill("QA Guppy A")
        page.get_by_label("Observation date", exact=True).fill(day)
        page.get_by_role("radio", name="worsening").click()
        save()
    trend = "Repeated worsening body condition"
    warning = "Nitrite is above zero in a confirmed recent test."
    visible(trend)
    water("nitrite", "0.37")
    visible(warning)
    water("nitrite", None)
    visible(warning)
    expect(page.get_by_text("Retest needed for nitrite.", exact=False).first).to_be_visible()
    water("nitrite", "0")
    visible(trend)
    expect(page.get_by_text("Retest needed for nitrite.", exact=False)).to_have_count(0)
    page.close()
    page = context.new_page()
    page.goto(url)
    visible(trend)
    visible("NEEDS ATTENTION")
    page.get_by_role("button", name="View body condition history").click()
    for day in dates:
        expect(page.get_by_text(f"QA Guppy A · worsening · {day}", exact=False)).to_be_visible()
    context.close()


def verify_missing_fish(browser, url):
    context = browser.new_context(timezone_id="UTC")
    page = context.new_page()
    page.goto(url)
    for name, outcome, note in [
        ("QA Guppy A", "Mark found", "Reported missing fish found"),
        ("QA Guppy B", "Confirm loss", "Loss confirmed by keeper"),
    ]:
        page.get_by_role("button", name="Record an observation").click()
        page.get_by_text("Care or note", exact=True).click()
        page.get_by_text("fish missing", exact=True).last.click()
        page.get_by_label("Fish identifier", exact=True).fill(name)
        page.get_by_text("Save update", exact=True).click()
        expect(page.get_by_text("Quick Update", exact=True)).to_be_hidden()
        page.get_by_role("tab", name="History").click()
        page.get_by_role("button", name=f"{outcome} for {name}").click()
        expect(page.get_by_text(f"{name} · {note}", exact=False)).to_be_visible()
        page.close()
        page = context.new_page()
        page.goto(url)
        page.get_by_role("tab", name="History").click()
        expect(page.get_by_role("button", name=f"{outcome} for {name}")).to_have_count(0)
        expect(page.get_by_text(f"{name} · Owner logged fish missing", exact=False)).to_be_visible()
        expect(page.get_by_text(f"{name} · {note}", exact=False)).to_have_count(1)
        expect(page.get_by_text("livestock loss", exact=True)).to_have_count(int(outcome == "Confirm loss"))
        page.get_by_role("tab", name="Home").click()
    context.close()


def verify_sample_source(browser, url):
    context = browser.new_context()
    page = context.new_page()
    page.goto(url)
    def water(parameter, value, tap=False):
        page.get_by_role("button", name="Record an observation").click()
        expect(page.get_by_role("radio", name="Tank", exact=True)).to_be_checked()
        if tap:
            page.get_by_role("radio", name="Tap water").click()
        page.get_by_text(parameter, exact=True).last.click()
        page.get_by_label("Water test value").fill(value)
        page.get_by_text("Save update", exact=True).click()
        expect(page.get_by_text("Quick Update", exact=True)).to_be_hidden()
    water("ammonia", "0")
    water("nitrate", "10")
    water("nitrite", "0.37")
    water("nitrite", "0", tap=True)
    warning = "Nitrite is above zero in a confirmed recent test."
    expect(page.get_by_text(warning, exact=True).first).to_be_visible()
    page.close()
    page = context.new_page()
    page.goto(url)
    expect(page.get_by_text(warning, exact=True).first).to_be_visible()
    page.get_by_role("tab", name="History").click()
    import re
    history = page.locator("body")
    for source, value in [("Tank", "0.37"), ("Tap water", "0")]:
        expect(history).to_contain_text(re.compile(r"nitrite\s+[^\n]*manual entry · " + source + r"\s+" + re.escape(value) + r" mg/L", re.I), use_inner_text=True)
    page.get_by_role("tab", name="Home").click()
    water("nitrite", "0")
    expect(page.get_by_text("ALL CLEAR", exact=True).first).to_be_visible()
    context.close()


def verify_breathing(browser, url):
    context = browser.new_context()
    page = context.new_page()
    page.goto(url)
    def start():
        page.get_by_role("button", name="Record an observation").click()
    def save():
        page.get_by_text("Save update", exact=True).click()
        expect(page.get_by_text("Quick Update", exact=True)).to_be_hidden()
    def water(parameter, value):
        start()
        page.get_by_text(parameter, exact=True).last.click()
        page.get_by_label("Water test value").fill(value)
        save()
    water("ammonia", "0")
    water("nitrite", "0")
    water("nitrate", "10")
    expect(page.get_by_text("ALL CLEAR", exact=True).first).to_be_visible()
    start()
    page.get_by_text("Care or note", exact=True).click()
    page.get_by_text("breathing observation", exact=True).last.click()
    page.get_by_label("Affected fish or group").fill("QA tetras")
    expect(page.get_by_role("checkbox", name="Still happening")).to_be_checked()
    save()
    reason = "You reported gasping in QA tetras and marked it as ongoing."
    expect(page.get_by_text(reason, exact=True).first).to_be_visible()
    page.close()
    page = context.new_page()
    page.goto(url)
    expect(page.get_by_text(reason, exact=True).first).to_be_visible()
    water("nitrite", "0")
    expect(page.get_by_text(reason, exact=True).first).to_be_visible()
    water("ammonia", "0.2")
    page.get_by_role("button", name="Review breathing observations").click()
    page.get_by_role("button", name="Mark breathing resolved for QA tetras").click()
    expect(page.get_by_text("Keeper marked the behavior resolved", exact=False)).to_be_visible()
    expect(page.get_by_text("ongoing at observation", exact=False)).to_be_visible()
    page.get_by_role("tab", name="Home").click()
    expect(page.get_by_text("Ammonia is above zero in a confirmed recent test.", exact=True).first).to_be_visible()
    context.close()


def verify_ammonia_retest(browser, url):
    import re
    context = browser.new_context()
    page = context.new_page()
    page.goto(url)
    def ammonia(value, source="Tank"):
        page.get_by_role("button", name="Record an observation").click()
        page.get_by_role("radio", name=source, exact=True).click()
        page.get_by_text("ammonia", exact=True).last.click()
        if value is None:
            page.get_by_role("checkbox", name="I can’t tell").click()
        else:
            page.get_by_label("Water test value").fill(value)
        page.get_by_text("Save update", exact=True).click()
        expect(page.get_by_text("Quick Update", exact=True)).to_be_hidden()
    ammonia("0")
    ammonia(None)
    ammonia("0", "Tap water")
    page.close()
    page = context.new_page()
    page.goto(url)
    expect(page.get_by_text("Retest needed", exact=True).first).to_be_visible()
    expect(page.get_by_text("Last confirmed ammonia: 0 mg/L", exact=False)).to_be_visible()
    ammonia("0.25")
    expect(page.get_by_text("Retest needed", exact=True)).to_have_count(0)
    expect(page.get_by_text("Ammonia is above zero in a confirmed recent test.", exact=True).first).to_be_visible()
    page.get_by_role("tab", name="History").click()
    history = page.locator("body")
    for source, value in [("Tank", "0"), ("Tap water", "0"), ("Tank", "0.25")]:
        expect(history).to_contain_text(re.compile(r"ammonia\s+[^\n]*manual entry · " + source + r"\s+" + re.escape(value) + r" mg/L", re.I), use_inner_text=True)
    expect(page.get_by_text("Uncertain ammonia test · Tank", exact=False)).to_be_visible()
    page.get_by_role("tab", name="Home").click()
    ammonia(None)
    expect(page.get_by_text("Ammonia is above zero in a confirmed recent test.", exact=True).first).to_be_visible()
    expect(page.get_by_text("Retest needed for ammonia.", exact=False).first).to_be_visible()
    context.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        with playwright.chromium.launch() as browser:
            verify(browser, sys.argv[1])
            verify_missing_fish(browser, sys.argv[1])
            verify_sample_source(browser, sys.argv[1])
            verify_breathing(browser, sys.argv[1])
            verify_ammonia_retest(browser, sys.argv[1])
