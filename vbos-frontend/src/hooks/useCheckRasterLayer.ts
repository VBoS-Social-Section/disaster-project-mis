import { useEffect, useState } from "react";

// It checks if the raster layer is available for a specific year via TiTiler.
// When using precomputed tiles, the check is skipped.
export function useCheckRasterLayer(
  datasetUrlId: string,
  year: string,
  isPrecomputed = false,
) {
  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState(false);
  const url = `${import.meta.env.VITE_TITILER_API}/dataset/${datasetUrlId}/years/${year}/tiles?f=json`;

  useEffect(() => {
    if (isPrecomputed) {
      setError(false);
      setIsloading(false);
      return;
    }
    // Skip TiTiler check when datasetUrlId is empty (metadata not loaded or precomputed-only config)
    if (!datasetUrlId) {
      setError(true);
      setIsloading(false);
      return;
    }
    setIsloading(true);
    fetch(url)
      .then((res) => {
        if (res.ok) {
          setError(false);
          setIsloading(false);
        } else {
          setError(true);
          setIsloading(false);
        }
      })
      .catch(() => {
        setError(true);
        setIsloading(false);
      });
  }, [url, isPrecomputed, datasetUrlId]);

  return { error: isPrecomputed ? false : error, isLoading: isPrecomputed ? false : isLoading };
}
