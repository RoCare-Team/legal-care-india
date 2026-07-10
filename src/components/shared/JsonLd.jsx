/**
 * JsonLd — renders a JSON-LD structured-data script for rich search results.
 *
 * @param {object} props
 * @param {object|object[]} props.data  a schema.org object (or array of them)
 */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
