# URL Forwarder

This is the source code of the native executable for the URL Forwarder extensions for Firefox and Chrome. It forwards the matched URLs to another external application which can be specified in the extension options.

## Message format

Here you can find a short description of the message format used.

### Incomming messages

JSON Obejct: 
{
    "target": "<should be path to the executable>",
    "args": "<additional program arguments>",
    "url": "<URL which was matched>"
}
    
This results in executing the "target args url" on the local system.

### Answer message

JSON Object:
{
    "error": true/false
    "response": "<some error description or the name of the target>"
}

The answer contains a flag showing if an error occured and some information as text.

