Set ws = CreateObject("Wscript.Shell")

    scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
    batPath = scriptDir & "\start_backend.bat"

    ws.Run """" & batPath & """", 0, False
