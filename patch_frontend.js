const fs = require('fs');

function patchFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    if (path.includes('Chat.tsx')) {
        content = content.replace(
            /const \{ data, error \} = await supabase\.functions\.invoke\(""legal-chat"", \{[\s\S]*?\}\);/g,
            \let data, error;
      try {
        const res = await fetch("http://localhost:8000/", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: \\\Bearer \\\\ } : {}) },
          body: JSON.stringify({ message: messageToSend, history, userName, attachments: attachments.length > 0 ? attachments : undefined })
        });
        if (!res.ok) error = { status: res.status, message: await res.text() };
        else data = await res.json();
      } catch(e) { error = e; }\
        );
    }
    
    if (path.includes('useLegalChat.ts')) {
        content = content.replace(
            /const \{ data, error \} = await supabase\.functions\.invoke\('legal-chat', \{[\s\S]*?\}\)/g,
            \let data, error;
      try {
        const res = await fetch("http://localhost:8000/", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: \\\Bearer \\\\ } : {}) },
          body: JSON.stringify(request)
        });
        if (!res.ok) error = { status: res.status, message: await res.text() };
        else data = await res.json();
      } catch(e) { error = e; }\
        );
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Patched', path);
}

patchFile('./src/pages/Chat.tsx');
patchFile('./src/hooks/useLegalChat.ts');