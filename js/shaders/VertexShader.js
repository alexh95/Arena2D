const vertexShaderCode =`
attribute vec4 vertexPosition;
attribute vec2 textureCoordinate;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 textureCoordinateMatrix;

varying highp vec2 textureCoordinateFragment;

void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    textureCoordinateFragment = (textureCoordinateMatrix * vec4(textureCoordinate, 0.0, 1.0)).xy;
}
`;
export default vertexShaderCode;
