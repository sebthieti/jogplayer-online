export function nfcall<T>(fn: Function, ...args): Promise<T> {
  return new Promise((resolve, reject) => {
    fn.apply(null, [...args, (err, res) => {
      !err ? resolve(res) : reject(err);
    }]);
  });
}
