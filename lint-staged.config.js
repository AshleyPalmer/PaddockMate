export default {
  "frontend/**/*.{js,ts,vue}": [
    "npx --prefix frontend eslint --fix",
    "prettier --write",
  ],
  "frontend/**/*.{json,css,html,md}": [
    "prettier --write",
  ],
  "backend/**/*.java": () => "./backend/gradlew -p backend spotlessApply",
  "*": "cspell --no-must-find-files",
};
