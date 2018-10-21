const fragmentShaderCode = `
varying highp vec2 textureCoordinateFragment;

uniform sampler2D sampler;

void main()
{
	lowp vec4 color = texture2D(sampler, textureCoordinateFragment);
	if (color.w == 0.0)
	{
		discard;
	}
	gl_FragColor = color;
}
`;
export default fragmentShaderCode;
