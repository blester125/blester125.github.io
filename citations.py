"""Update the references.json file with latest counts."""

from datetime import datetime
import json
import os
import sys
import requests


def get_citation_count(paper_id, api_key=None):
    url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}?fields=citationCount"
    # Use requests as the default urllib library auto capitalizes fields like "x-api-key"
    # to "X-api-key" and the semantic scholar server seems to be case-sensitive even though
    # they should not be according to RFC 2616.
    headers = {"x-api-key": api_key} if api_key else {}
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        raise ValueError("Invalid Response!")
    data = r.json()
    return data["citationCount"]


def date():
    return datetime.now().strftime("%Y/%m/%d")


def main():
    if len(sys.argv) == 1:
        raise ValueError("usage: python citations.py references.json")
    api_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
    if api_key is not None:
        print("USING API KEY")
    today = date()

    filename = sys.argv[1]
    with open(filename) as f:
      references = json.load(f)

    new_references = []
    for reference in references:
        if reference.get("semantic_scholar_id") != None:
            print(f"Checking: {reference['title']}")
            try:
                new_count = get_citation_count(reference["semantic_scholar_id"], api_key)
                reference["citation_count"] = new_count
                reference["fallback_citation_count_date"] = today
            except ValueError:
                pass
        new_references.append(reference)

    assert len(new_references) == len(references)

    with open(f"{filename}", "w") as w:
        json.dump(new_references, w, indent=2)


if __name__ == "__main__":
    main()
