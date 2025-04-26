using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class AnswerResponse : Response
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [JsonPropertyName("answerText")]
    public string? AnswerText { get; set; }
}
