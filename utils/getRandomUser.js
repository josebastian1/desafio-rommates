import fetch from 'node-fetch';

export const getRandomUser = async () => {
  const response = await fetch('https://randomuser.me/api/');
  const data = await response.json();
  const user = data.results[0];
  return {
    nombre: `${user.name.first} ${user.name.last}`
  };
};
