# Working Genius Team Map

A single-page team map with interactive member and assessment-category filters.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal, then use **Upload team JSON** to select your data file.

Use **Build a team** in the page header to open the JSON builder. It can import an existing team JSON, add/edit/delete members, infer competencies from each member's selected geniuses and frustrations, and download the completed `team.json`.

After uploading a team on the map page, a compact read-only roster appears above Team Distribution. Names are sorted by last name, and six letters show each member's geniuses, competencies, and frustrations in category colors. Distribution filters do not hide roster entries.

For production, run `npm run build` and then `npm start`. The Node.js server serves the built page on port 3000. Set `PORT` to change the port.

## Team data

Choose a `.json` file from **Upload team JSON**. The file is read in your browser and is not uploaded to the server. Team data is kept only in the current page; upload it again after refreshing. In Team Distribution, click a category label to show or hide that assessment. Use the team-member controls to include or exclude people; excluded names are struck through there and omitted from the distribution. Click a visible name in the distribution to focus on that person, then click them again to restore the previous member selection.

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
