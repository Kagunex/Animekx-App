const upstreamTransformer = require("@expo/metro-config/babel-transformer");

module.exports.transform = ({ src, filename, options }) => {
  if (!filename.endsWith(".svg")) {
    return upstreamTransformer.transform({ src, filename, options });
  }

  const xml = JSON.stringify(src);
  const component = `import React from 'react';\nimport { SvgXml } from 'react-native-svg';\nexport default function SvgAsset(props) { return <SvgXml xml={${xml}} {...props} />; }`;
  return upstreamTransformer.transform({
    src: component,
    filename: filename + ".tsx",
    options,
  });
};
