import React, { useEffect, useRef } from 'react';

const DocxPreview = ({ arrayBuffer }) => {
  const containerRef = useRef();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!arrayBuffer || !containerRef.current) return;
      try {
        const docx = await import('docx-preview');
        // Try several common APIs
        if (docx.renderAsync && typeof docx.renderAsync === 'function') {
          await docx.renderAsync(arrayBuffer, containerRef.current);
        } else if (docx.render && typeof docx.render === 'function') {
          docx.render(arrayBuffer, containerRef.current);
        } else if (docx.default && typeof docx.default.renderAsync === 'function') {
          await docx.default.renderAsync(arrayBuffer, containerRef.current);
        } else {
          containerRef.current.innerText = 'DOCX preview is not supported with the current docx-preview API.';
        }
      } catch (err) {
        console.error('DocxPreview error:', err);
        if (containerRef.current) containerRef.current.innerText = 'Failed to render DOCX preview.';
      }
    })();

    return () => { cancelled = true; };
  }, [arrayBuffer]);

  return <div ref={containerRef} className="docx-preview-container w-full overflow-auto" style={{minHeight: '320px'}}></div>;
};

export default DocxPreview;