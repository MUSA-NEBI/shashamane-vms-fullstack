/**
 * useFetch.js
 * Generic data-fetching hook with loading/error/refetch support.
 * Usage: const { data, isLoading, error, refetch } = useFetch(vehicleAPI.getAll, { page: 1 });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useFetch = (fetchFn, params = {}, deps = []) => {
  const [data, setData]         = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState(null);
  // Use a ref to hold params to avoid stale closures
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(overrideParams ?? paramsRef.current);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, ...deps]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export default useFetch;
