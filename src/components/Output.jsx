const Output = ({ srcDoc }) => {
  return (
    <div className="w-full h-full bg-white rounded-lg max-w-full">
      <iframe
        srcDoc={srcDoc}
        title="output"
        sandbox="allow-scripts"
        frameBorder="0"
        width="100%"
        height="100%"
        className=""
      ></iframe>
    </div>
  );
};

export default Output;
