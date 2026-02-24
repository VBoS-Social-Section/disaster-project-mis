import { useQuery } from "@tanstack/react-query";
import API from "@/api";

function useDataset(
  dataType: "tabular" | "vector",
  id: number,
  filters: URLSearchParams,
) {
  const { isPending, error, data } = useQuery({
    queryKey: [
      "dataset",
      dataType,
      id,
      new URLSearchParams(filters).toString(),
    ],
    queryFn: () => API.getDatasetData(dataType, id, filters),
  });

  return {
    isPending,
    error,
    data,
  };
}

export { useDataset };
