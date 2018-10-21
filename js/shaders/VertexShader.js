const vertexShaderCode =`
attribute vec4 vertexPosition;
attribute vec2 textureCoordinate;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying highp vec2 textureCoordinateFragment;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    textureCoordinateFragment = textureCoordinate;
}
`;
export default vertexShaderCode;
