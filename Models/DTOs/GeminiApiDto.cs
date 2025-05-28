using System.Text.Json.Serialization;

namespace Crux.Models.DTOs;

internal class GeminiRequestPart
{
    [JsonPropertyName("text")]
    public required string Text { get; set; }
}

internal class GeminiRequestContent
{
    [JsonPropertyName("parts")]
    public required List<GeminiRequestPart> Parts { get; set; }
}

internal class GeminiResponseSchemaProperty
{
    [JsonPropertyName("type")]
    public required string Type { get; set; }
}

internal class GeminiResponseSchemaItem
{
    [JsonPropertyName("type")]
    public required string Type { get; set; }

    [JsonPropertyName("properties")]
    public required Dictionary<string, GeminiResponseSchemaProperty> Properties { get; set; }
}

internal class GeminiResponseSchema
{
    [JsonPropertyName("type")]
    public required string Type { get; set; }

    [JsonPropertyName("items")]
    public required GeminiResponseSchemaItem Items { get; set; }
}

internal class GeminiGenerationConfig
{
    [JsonPropertyName("responseMimeType")]
    public required string ResponseMimeType { get; set; }

    [JsonPropertyName("responseSchema")]
    public required GeminiResponseSchema ResponseSchema { get; set; }
}

internal class GeminiApiRequest
{
    [JsonPropertyName("contents")]
    public required List<GeminiRequestContent> Contents { get; set; }

    [JsonPropertyName("generationConfig")]
    public required GeminiGenerationConfig GenerationConfig { get; set; }
}

internal class GeminiResourceItem
{
    [JsonPropertyName("title")]
    public required string Title { get; set; }

    [JsonPropertyName("url")]
    public required string Url { get; set; }
}

internal class GeminiOuterResponsePart
{
    [JsonPropertyName("text")]
    public string Text { get; set; }
}

internal class GeminiOuterResponseContent
{
    [JsonPropertyName("parts")]
    public List<GeminiOuterResponsePart> Parts { get; set; }

    [JsonPropertyName("role")]
    public string Role { get; set; }
}

internal class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiOuterResponseContent Content { get; set; }

    [JsonPropertyName("finishReason")]
    public string FinishReason { get; set; }
}

internal class GeminiUsageMetadata
{
    [JsonPropertyName("promptTokenCount")]
    public int PromptTokenCount { get; set; }

    [JsonPropertyName("candidatesTokenCount")]
    public int CandidatesTokenCount { get; set; }

    [JsonPropertyName("totalTokenCount")]
    public int TotalTokenCount { get; set; }
}

internal class GeminiFullApiResponse
{
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate> Candidates { get; set; }

    [JsonPropertyName("usageMetadata")]
    public GeminiUsageMetadata UsageMetadata { get; set; }
}
