export const onRequest: PagesFunction<{}> = async (context) => {
	const req = context.request;
  const original = await fetch(req);

  return new Response(
    await original.text(),
    {
      headers: {
        ...original.headers,
        'X-Test-Header': 'This is a test message'
      }
    }
  )
}