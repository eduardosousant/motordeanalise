# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fc276700-9e40-4240-bada-d555c56f6f2f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

In **Motor Tributário SEFAZ/MT**, **Importar Excel** accepts `.xls` and `.xlsx` files. The first sheet must include columns for NCM, product, quantity, and unit price; extra columns such as item number, unit of measure, and total price are ignored. The app previews the rows before replacing the current operation items.
