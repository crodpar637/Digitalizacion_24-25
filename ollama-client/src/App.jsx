import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const models = [
  { id: 1, name: "deepseek-r1", version: "8b" },
  { id: 2, name: "deepseek-r1", version: "1.5b" },
  { id: 3, name: "mistral", version: "7b" },
];

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleModelChange = (e) => {
    const model = models.find((m) => m.id === e.target.value);
    setSelectedModel(model);
  };

  const cleanResponse = (text) => {
    return text.replace(/<think.*?>/g, "").replace(/<\/think>/g, "");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: `${selectedModel.name}:${selectedModel.version}`,
          prompt: question,
        }),
      });

      if (!res.ok) throw new Error("Error en la solicitud");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedData = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        accumulatedData += decoder.decode(value, { stream: true });

        const fragments = accumulatedData.split("\n");
        accumulatedData = fragments.pop();

        for (const fragment of fragments) {
          try {
            const parsed = JSON.parse(fragment);
            const cleanedResponse = cleanResponse(parsed.response);
            setResponse((prev) => prev + cleanedResponse);
          } catch (error) {
            console.error("Error al procesar fragmento JSON:", error);
          }
        }
      }
    } catch (error) {
      setResponse("Error al procesar la solicitud.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Consulta a Ollama
      </Typography>

      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel>Modelo</InputLabel>
        <Select value={selectedModel.id} onChange={handleModelChange}>
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id}>
              {`${model.name} (${model.version})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Pregunta"
        variant="outlined"
        fullWidth
        value={question}
        onChange={handleQuestionChange}
        disabled={loading}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        fullWidth
        sx={{ marginTop: 2 }}
        disabled={loading || !question}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Enviar Pregunta"
        )}
      </Button>

      <Box
        sx={{
          marginTop: 2,
          padding: 2,
          border: "1px solid #ccc",
          minHeight: 100,
        }}
      >
        <Typography variant="h6">Respuesta:</Typography>
        <Box sx={{ whiteSpace: "pre-wrap" }}>
          {response ? (
            <ReactMarkdown>{response}</ReactMarkdown>
          ) : loading ? (
            "Esperando respuesta..."
          ) : (
            "No hay respuesta aún."
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default App;
