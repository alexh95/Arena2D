const fragmentShaderCode = `
varying highp vec2 textureCoordinateFragment;

uniform sampler2D sampler;

void main() {
	gl_FragColor = texture2D(sampler, textureCoordinateFragment);
}
`;
export default fragmentShaderCode;
