import axios from 'axios';

export const getOutfitDetails = id => {
  return axios.get(`/api/outfits/${id}`);
}

export const createOutfitComment = (id, newComment) => {
  return axios.post(`/api/outfits/${id}/comments`, newComment, {
    'headers': { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  });
}

export const getOutfitsByCatName = catName => {
  return axios.get(`/api/outfits/category/${catName}`);
}

export const getOutfitsByHashtag = hashtag => {
  return axios.get(`/api/hashtags/${hashtag}`);
}