const iconName = Bun.argv[2];
const source = `https://raw.githubusercontent.com/lucide-icons/lucide/refs/heads/main/icons/${iconName}.svg`;
const colors = {
  dark: "#eee",
  light: "#111",
};
Object.entries(colors).forEach(([theme, color]) => {
  const target = `./resources/${theme}/${iconName}.svg`;
  fetch(source)
    .then((res) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error("Failed to fetch icon");
    })
    .then((text) => {
      return Bun.write(
        target,
        text.replace(/stroke="currentColor"/g, `stroke="${color}"`),
      );
    });
});
