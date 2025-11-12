
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // result is a data URL: data:mime/type;base64,the-real-base64-string
      // We only need the part after the comma.
      const result = reader.result as string;
      const base64Content = result.split(',')[1];
      if (base64Content) {
        resolve(base64Content);
      } else {
        reject(new Error("Failed to read file content as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
