import axios from "@/api/axiosInstant.js"



export const checkFileAPI = async (host, payload) => {
  const url = `${host.uid}/file/checkfile`;
  const {data} = await axios.get(url, payload);
  return {result: data, success: true};
}