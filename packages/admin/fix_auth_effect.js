const fs = require('fs');
let code = fs.readFileSync('src/components/AuthContext.tsx', 'utf8');

const newEffect = `
  useEffect(() => {
    let alive = true;

    const initSupabaseAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        localStorage.setItem("sb-token", session.access_token);
        try {
          const m = await fetchMe();
          if (alive) {
            setStoredMe(m);
            setMe(m);
          }
        } catch (err) {
          if (alive) {
            clearAuth();
            setToken(null);
            setMe(null);
          }
        }
      } else if (token && !me) {
        // Fallback for email login if session wasn't picked up natively
        try {
          const m = await fetchMe();
          if (alive) {
            setStoredMe(m);
            setMe(m);
          }
        } catch (err) {
          if (alive) {
            clearAuth();
            setToken(null);
            setMe(null);
          }
        }
      }
      if (alive) setLoading(false);
    };

    initSupabaseAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setToken(session.access_token);
        localStorage.setItem("sb-token", session.access_token);
        try {
          const m = await fetchMe();
          setStoredMe(m);
          setMe(m);
        } catch (err) {
          // ignore
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
        setToken(null);
        setMe(null);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);
`;

// Find the start of the useEffect block
const startIdx = code.indexOf('  useEffect(() => {');
// Find the end of it
const endIdx = code.indexOf('  }, [token, me]);') + '  }, [token, me]);'.length;

if (startIdx !== -1 && endIdx !== -1) {
  // We need to add import { supabase } from "../supabase"; if not present
  let newCode = code.substring(0, startIdx) + newEffect + code.substring(endIdx);
  if (!newCode.includes('import { supabase } from "../supabase";')) {
    newCode = 'import { supabase } from "../supabase";\n' + newCode;
  }
  fs.writeFileSync('src/components/AuthContext.tsx', newCode);
  console.log("Successfully replaced useEffect");
} else {
  console.log("Could not find useEffect bounds");
}
