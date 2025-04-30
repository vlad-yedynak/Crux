using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class ContentResponse : Response
{
    [JsonPropertyName("cardId")]
    public int? CardId { get; set; }
}
