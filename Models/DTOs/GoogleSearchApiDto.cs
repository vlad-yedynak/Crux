using System.Text.Json.Serialization;

namespace Crux.Models.DTOs;

public class GoogleSearchResponse
{
    [JsonPropertyName("kind")]
    public string? Kind { get; set; }

    [JsonPropertyName("url")]
    public GoogleSearchUrl? Url { get; set; }

    [JsonPropertyName("queries")]
    public GoogleSearchQueries? Queries { get; set; }

    [JsonPropertyName("context")]
    public GoogleSearchContext? Context { get; set; }

    [JsonPropertyName("searchInformation")]
    public GoogleSearchInformation? SearchInformation { get; set; }

    [JsonPropertyName("items")]
    public List<GoogleSearchItem>? Items { get; set; }
}

public class GoogleSearchUrl
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("template")]
    public string? Template { get; set; }
}

public class GoogleSearchQueries
{
    [JsonPropertyName("request")]
    public List<GoogleSearchRequest>? Request { get; set; }

    [JsonPropertyName("nextPage")]
    public List<GoogleSearchRequest>? NextPage { get; set; }
}

public class GoogleSearchRequest
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("totalResults")]
    public string? TotalResults { get; set; }

    [JsonPropertyName("searchTerms")]
    public string? SearchTerms { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("startIndex")]
    public int StartIndex { get; set; }

    [JsonPropertyName("inputEncoding")]
    public string? InputEncoding { get; set; }

    [JsonPropertyName("outputEncoding")]
    public string? OutputEncoding { get; set; }

    [JsonPropertyName("safe")]
    public string? Safe { get; set; }

    [JsonPropertyName("cx")]
    public string? Cx { get; set; }
}

public class GoogleSearchContext
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }
}

public class GoogleSearchInformation
{
    [JsonPropertyName("searchTime")]
    public double SearchTime { get; set; }

    [JsonPropertyName("formattedSearchTime")]
    public string? FormattedSearchTime { get; set; }

    [JsonPropertyName("totalResults")]
    public string? TotalResults { get; set; }

    [JsonPropertyName("formattedTotalResults")]
    public string? FormattedTotalResults { get; set; }
}

public class GoogleSearchItem
{
    [JsonPropertyName("kind")]
    public string? Kind { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("htmlTitle")]
    public string? HtmlTitle { get; set; }

    [JsonPropertyName("link")]
    public string? Link { get; set; }

    [JsonPropertyName("displayLink")]
    public string? DisplayLink { get; set; }

    [JsonPropertyName("snippet")]
    public string? Snippet { get; set; }

    [JsonPropertyName("htmlSnippet")]
    public string? HtmlSnippet { get; set; }

    [JsonPropertyName("formattedUrl")]
    public string? FormattedUrl { get; set; }

    [JsonPropertyName("htmlFormattedUrl")]
    public string? HtmlFormattedUrl { get; set; }

    [JsonPropertyName("pagemap")]
    public GooglePageMap? PageMap { get; set; }
}

public class GooglePageMap
{
    [JsonPropertyName("metatags")]
    public List<GoogleMetaTag>? MetaTags { get; set; }

    [JsonPropertyName("cse_thumbnail")]
    public List<GoogleThumbnail>? CseThumbnail { get; set; }

    [JsonPropertyName("cse_image")]
    public List<GoogleImage>? CseImage { get; set; }
}

public class GoogleMetaTag
{
    [JsonPropertyName("og:image")]
    public string? OgImage { get; set; }

    [JsonPropertyName("og:title")]
    public string? OgTitle { get; set; }

    [JsonPropertyName("og:description")]
    public string? OgDescription { get; set; }

    [JsonExtensionData]
    public Dictionary<string, object>? AdditionalProperties { get; set; }
}

public class GoogleThumbnail
{
    [JsonPropertyName("src")]
    public string? Src { get; set; }

    [JsonPropertyName("width")]
    public string? Width { get; set; }

    [JsonPropertyName("height")]
    public string? Height { get; set; }
}

public class GoogleImage
{
    [JsonPropertyName("src")]
    public string? Src { get; set; }
}

public class SearchResult
{
    public string Title { get; set; } = string.Empty;
    
    public string Link { get; set; } = string.Empty;
    
    public string? Thumbnail { get; set; }
}
