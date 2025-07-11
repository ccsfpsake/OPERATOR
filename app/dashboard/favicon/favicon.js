'use client';

import { useEffect, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../lib/firebaseConfig';

export default function Favicon() {
  const [faviconUrl, setFaviconUrl] = useState(null);

  useEffect(() => {
    const fetchFavicon = async () => {
      const fileExtensions = ['png', 'jpg', 'jpeg']; 

      for (const ext of fileExtensions) {
        try {
          const faviconRef = ref(storage, `Logo/favicon.${ext}`);
          const url = await getDownloadURL(faviconRef);
          setFaviconUrl(url);
          return; 
        } catch (error) {
          console.warn(`Favicon not found: favicon.${ext}`);
        }
      }

      console.error('No valid favicon found.');
    };

    fetchFavicon();
  }, []);

  if (!faviconUrl) return null; 

  return <link rel="icon" type="image/png" sizes="32x32" href={faviconUrl} />;
}
