#!/usr/bin/env python3

import re
import datetime

today = datetime.date.today().strftime("%Y")

with open("static/footer.html") as f:
    footer = f.read()

footer = re.sub(r"&ndash; \d\d\d\d Brian Lester,", fr"&ndash; {today} Brian Lester,", footer)
print(footer)

with open("static/footer.html", "w") as wf:
    wf.write(footer)
