# Open Library API notes

No API key. Open Library asks apps to send a descriptive `User-Agent` (app name + contact) and to keep request volume low.

## Search: `GET https://openlibrary.org/search.json`

Example: `/search.json?q=the+hobbit&limit=20&fields=key,title,author_name,cover_i,first_publish_year,edition_count`

Use `fields=` to keep responses small. Without it each doc carries large arrays (hundreds of ISBNs, subjects, etc.).

Top level:

| Field | Meaning | Used? |
|---|---|---|
| `numFound` / `num_found` | Total matches | Yes: "N results" and empty state |
| `start` | Offset of the first doc | Pagination later, if needed |
| `q` | The query echoed back | No |
| `docs` | Array of matching works | Yes |

Each item in `docs` (one *work*, which groups all editions of a book):

| Field | Meaning | Used? |
|---|---|---|
| `key` | Work id, e.g. `/works/OL27482W` | Yes: stable id for saving |
| `title` | Title | Yes |
| `author_name` | Array of author names (can be missing) | Yes |
| `author_key` | Array of author ids | No |
| `cover_i` | Cover image id (can be missing) | Yes: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg` |
| `first_publish_year` | Year (can be missing) | Yes |
| `edition_count` | Number of editions | Yes, small detail |
| `isbn`, `subject`, `language` | Large arrays | No |

## Nothing found

Still HTTP 200, with `numFound: 0` and `docs: []`. The app must treat this as an "empty" state, not an error.

## Work details: `GET https://openlibrary.org/works/OL27482W.json`

Returns `title`, `description`, `covers`, `subjects`, `first_publish_date`, `authors` (keys only).
`description` is either a plain string or `{ "type": "/type/text", "value": "..." }`; handle both.
An unknown work id returns HTTP 404.

## Trending: `GET https://openlibrary.org/trending/daily.json?limit=14`

The works people opened most today, under `works` (same fields as search `docs`: `key`, `title`, `author_name`, `cover_i`, `first_publish_year`). Used on the landing page covers, the empty search page and the signed-in home. About 36 KB for 12 works.

## More by an author: `GET https://openlibrary.org/search.json?author=Ursula+K.+Le+Guin&sort=rating`

Same response as search. Used on the book page; the current book is filtered out.

## Failure cases to design for

- Network error / timeout / HTTP 5xx → "Open Library is unavailable" state with retry.
- HTTP 200 with `docs: []` → "No books found" state.
- Missing `cover_i`, `author_name`, `first_publish_year` → placeholders in the UI.
