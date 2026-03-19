export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const stripBase64Prefix = (base64String: string): string => {
  return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
};

export const getMimeTypeFromBase64 = (base64String: string): string => {
  const match = base64String.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};
