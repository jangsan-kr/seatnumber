name: Deploy GitHub Pages

on:
  push:
    branches:
      - main # main 브랜치에 푸시될 때 작동 (만약 master라면 master로 변경)

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v3

      - name: Install and Build 🔧
        run: |
          npm install
          npm run build

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist # 빌드 결과물이 저장되는 폴더
