export function nfcall(fn: Function, ...args) {
  return new Promise((resolve, reject) => {
    fn.apply(null, [...args, (err, res) => {
      !err ? resolve(res) : reject(err);
    }]);
  });
}
