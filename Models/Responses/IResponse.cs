using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public interface IResponse
{
    [JsonPropertyName("Success")]
    public bool Success { get; set; }
    
    [JsonPropertyName("Error")]
    public string? Error { get; set; }
}
