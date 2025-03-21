export default async function () {
  const ip = await fetch("https://api.my-ip.io/v2/ip.json").then((res) =>
    res.json(),
  );
  console.log(ip?.country?.code || "");
}
