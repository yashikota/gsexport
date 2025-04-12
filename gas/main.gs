function doGet(e) {
  const inputUrl = e.parameter.url;
  if (!inputUrl) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Missing presentation URL in query: ?url=...' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const presentationId = extractPresentationId(inputUrl);
  if (!presentationId) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Invalid Google Slides URL format.' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const presentation = SlidesApp.openById(presentationId);
    const slides = presentation.getSlides();
    const title = presentation.getName();

    const slideUrls = slides.map(slide => {
      const slideId = slide.getObjectId();
      return `https://docs.google.com/presentation/d/${presentationId}/present?slide=id.${slideId}`;
    });

    const output = {
      title: title,
      total: slides.length,
      slides: slideUrls
    };

    return ContentService
      .createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function extractPresentationId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
