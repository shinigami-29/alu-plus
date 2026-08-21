const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O, 1/I हटाइएको — confusion नहोस् भनेर

export const generateRoomCode = (length = 6): string => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return code;
};