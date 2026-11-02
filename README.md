# Working Genius Team Map

A single-page team map with live filters for teammates and all six Working Genius types.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The development server starts the JSON API alongside it.

For production, run `npm run build` and then `npm start`. The Node.js server serves the built page and the team-data API on port 3000. Set `PORT` to change the port.

## Team data

Edit [`data/team.json`](./data/team.json) to replace the fictional starter team. Each record must have a first and last name, exactly two entries in each assessment group, and each of the six Working Genius types exactly once across those groups:

```json
{
  "FNAME": "Alex",
  "LNAME": "Morgan",
  "Geniuses": ["Wonder", "Invention"],
  "Competencies": ["Discernment", "Galvanizing"],
  "Frustrations": ["Enablement", "Tenacity"]
}
```

The API reads the file on each request, so edits are reflected after refreshing the page. Invalid JSON or assessment data is reported by the API rather than silently ignored.
