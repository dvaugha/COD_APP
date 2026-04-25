import os
import re

def bundle():
    repo_root = r"c:\Users\Dan\.gemini\antigravity\scratch\cod-golf\COD_APP"
    index_path = os.path.join(repo_root, "index.html")
    styles_path = os.path.join(repo_root, "css", "styles.css")
    courses_path = os.path.join(repo_root, "data", "courses.js")
    app_path = os.path.join(repo_root, "js", "app.js")
    gold_path = os.path.join(repo_root, "CODv278_GOLD.html")

    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    with open(styles_path, 'r', encoding='utf-8') as f:
        css = f.read()

    with open(courses_path, 'r', encoding='utf-8') as f:
        courses_js = f.read()

    with open(app_path, 'r', encoding='utf-8') as f:
        app_js = f.read()

    # Replace CSS link
    html = re.sub(r'<link rel="stylesheet" href="css/styles.css[^">]*">', f'<style>\n{css}\n</style>', html)

    # Replace JS links
    html = re.sub(r'<script src="data/courses.js[^">]*"></script>', f'<script>\n{courses_js}\n</script>', html)
    html = re.sub(r'<script src="js/app.js[^">]*"></script>', f'<script>\n{app_js}\n</script>', html)

    with open(gold_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"Created {gold_path}")

if __name__ == "__main__":
    bundle()
