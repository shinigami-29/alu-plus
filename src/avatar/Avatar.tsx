// photos of avatars
export const AVATAR_LIST = [
  {id: 'ava1', source: require('../images/avatar/ava1.png')},
  {id: 'ava2', source: require('../images/avatar/ava2.png')},
  {id: 'ava3', source: require('../images/avatar/ava3.png')},
  {id: 'ava4', source: require('../images/avatar/ava4.png')},
  {id: 'ava5', source: require('../images/avatar/ava5.png')},
  {id: 'ava7', source: require('../images/avatar/ava7.png')},
  {id: 'ava8', source: require('../images/avatar/ava8.png')},
  {id: 'ava9', source: require('../images/avatar/ava9.png')},
  {id: 'ava10', source: require('../images/avatar/ava10.png')},
  {id: 'ava11', source: require('../images/avatar/ava11.png')},
  {id: 'ava12', source: require('../images/avatar/ava12.png')},
];

export const getAvatarSource = (avatarId: string | null | undefined) => {
  const found = AVATAR_LIST.find(a => a.id === avatarId);
  return found?.source ?? null;
};