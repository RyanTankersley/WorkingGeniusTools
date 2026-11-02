# Working Genius Team Map

A single-page team map with live filters for teammates and all six Working Genius types.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal, then use **Upload team JSON** to select your data file.

For production, run `npm run build` and then `npm start`. The Node.js server serves the built page on port 3000. Set `PORT` to change the port.

## Team data

Choose a `.json` file from **Upload team JSON**. The file is read in your browser and is not uploaded to the server. Team data is kept only in the current page; upload it again after refreshing.

Each record must have a first and last name, exactly two entries in each assessment group, and each of the six Working Genius types exactly once across those groups:

```json
{
  "FNAME": "Alex",
  "LNAME": "Morgan",
  "Geniuses": ["Wonder", "Invention"],
  "Competencies": ["Discernment", "Galvanizing"],
  "Frustrations": ["Enablement", "Tenacity"]
}
```

Invalid JSON or assessment data is reported in the page. A failed upload does not replace a team that is already loaded.
