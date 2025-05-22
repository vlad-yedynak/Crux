using Crux.Data;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Crux.Models.Cards;

namespace Crux.Services;

public class EducationalDataService(ApplicationDbContext dbContext, IWebHostEnvironment webHostEnvironment) : IEducationalDataService
{
    public EducationalDataResponse AddEducationalData(EducationalCardDataRequest educationalCardDataRequest)
    {
        var educationalCard = dbContext.EducationalCards.
            Include(ec => ec.Images).
            Include(ec => ec.Attachments).
            FirstOrDefault(ec => ec.Id == educationalCardDataRequest.CardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = educationalCardDataRequest.Content;
        
        educationalCard.Images.Clear(); 
        educationalCard.Attachments.Clear();

        if (educationalCardDataRequest.Images != null && educationalCardDataRequest.Images.Count != 0)
        {
            var images = educationalCardDataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }).ToList();
            
            images.ForEach(img => educationalCard.Images.Add(img));
        }

        if (educationalCardDataRequest.Attachments != null && educationalCardDataRequest.Attachments.Any())
        {
            var attachments = educationalCardDataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }).ToList();
            
            attachments.ForEach(att => educationalCard.Attachments.Add(att));
        }
        
        dbContext.SaveChanges();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }
    
    public async Task<EducationalDataResponse> AddEducationalDataAsync(EducationalCardDataRequest educationalCardDataRequest)
    {
        var educationalCard = await dbContext.EducationalCards.
            Include(ec => ec.Images).
            Include(ec => ec.Attachments).
            FirstOrDefaultAsync(ec => ec.Id == educationalCardDataRequest.CardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = educationalCardDataRequest.Content;
        
        educationalCard.Images.Clear();
        educationalCard.Attachments.Clear();

        if (educationalCardDataRequest.Images != null && educationalCardDataRequest.Images.Count != 0)
        {
            var cardImages = new List<CardImage>();
            var uploadUrl = Path.Combine(webHostEnvironment.WebRootPath, "uploads", "images", "educational-cards", educationalCard.Id.ToString());

            if (!Directory.Exists(uploadUrl))
            {
                Directory.CreateDirectory(uploadUrl);
            }

            foreach (var image in educationalCardDataRequest.Images)
            {
                if (string.IsNullOrWhiteSpace(image.Url) || !Uri.TryCreate(image.Url, UriKind.Absolute, out var uri))
                {
                    return new EducationalDataResponse
                    {
                        Success = false,
                        Error = "Invalid Image"
                    };
                }
                
                try
                {
                    var client = new HttpClient();
                    var response = await client.GetAsync(image.Url);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var imageResponse = await response.Content.ReadAsByteArrayAsync();
                        var contentType = response.Content.Headers.ContentType?.MediaType;

                        if (contentType == null)
                        {
                            return new EducationalDataResponse
                            {
                                Success = false,
                                Error = "Invalid Image"
                            };
                        }
                        
                        var extension = Path.GetExtension(uri.AbsolutePath);
                        if (string.IsNullOrEmpty(extension) || extension.Length > 5)
                        {
                            if (contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase)) extension = ".jpg";
                            else if (contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase)) extension = ".png";
                            else if (contentType.Equals("image/gif", StringComparison.OrdinalIgnoreCase)) extension = ".gif";
                            else if (contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase)) extension = ".webp";
                            else extension = ".img";
                        }

                        var fileName = $"{Guid.NewGuid()}.{extension}";
                        var filePath = Path.Combine(uploadUrl, fileName);
                        await File.WriteAllBytesAsync(filePath, imageResponse);
                        
                        var serverUrl = $"/uploads/images/educational-cards/{educationalCard.Id}/{fileName}";
                        
                        cardImages.Add(new CardImage
                        {
                            Url = serverUrl,
                            Caption = image.Caption,
                            AltText = image.AltText,
                            EducationalCardId = educationalCard.Id
                        });
                    }
                    else
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Failed to receive image"
                        };   
                    }
                }
                catch (Exception)
                {
                    return new EducationalDataResponse
                    {
                        Success = false,
                        Error = "Failed to save image"
                    };
                }
            }
            educationalCard.Images.AddRange(cardImages);
        }
        
        if (educationalCardDataRequest.Attachments != null && educationalCardDataRequest.Attachments.Count != 0)
        {
            var cardAttachment = new List<CardAttachment>();
            var uploadUrl = Path.Combine(webHostEnvironment.WebRootPath,"uploads", "attachments", "educational-cards", educationalCard.Id.ToString());

            if (!Directory.Exists(uploadUrl))
            {
                Directory.CreateDirectory(uploadUrl);
            }

            foreach (var attachment in educationalCardDataRequest.Attachments)
            {
                if (string.IsNullOrWhiteSpace(attachment.Url) || !Uri.TryCreate(attachment.Url, UriKind.Absolute, out var uri))
                {
                    return new EducationalDataResponse
                    {
                        Success = false,
                        Error = "Invalid attachment"
                    };
                }

                try
                {
                    var client = new HttpClient();
                    var response = await client.GetAsync(attachment.Url);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var fileBytes = await response.Content.ReadAsByteArrayAsync();
                        var originalFileName = Path.GetFileName(attachment.Url);

                        if (string.IsNullOrEmpty(originalFileName))
                        {
                            originalFileName = "attachment";
                        }
                        
                        var extension = Path.GetExtension(originalFileName);
                        if (string.IsNullOrEmpty(extension))
                        {
                            extension = ".dat";
                        }
                        
                        var serverFileName = $"{Guid.NewGuid()}{extension}";
                        var filePath = Path.Combine(uploadUrl, serverFileName);
                        await File.WriteAllBytesAsync(filePath, fileBytes);
                        
                        var serverUrl = $"/uploads/attachments/educational-cards/{educationalCard.Id}/{serverFileName}";
                        
                        cardAttachment.Add(new CardAttachment
                        {
                            Url = serverUrl,
                            Description = attachment.Description,
                            EducationalCardId = educationalCard.Id
                        });
                    }
                    else
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Failed to receive file"
                        };   
                    }
                }
                catch (Exception)
                {
                    return new EducationalDataResponse
                    {
                        Success = false,
                        Error = "Failed to save file"
                    };
                }
            }
            educationalCard.Attachments.AddRange(cardAttachment);
        }
        
        await dbContext.SaveChangesAsync();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }
    
    public bool DeleteEducationalCardFiles(int cardId)
    {
        var imagesDirectory = Path.Combine(webHostEnvironment.WebRootPath, "uploads", "images", "educational-cards", cardId.ToString());
        var attachmentsDirectory = Path.Combine(webHostEnvironment.WebRootPath, "uploads", "attachments", "educational-cards", cardId.ToString());
        
        if (Directory.Exists(imagesDirectory))
        {
            try
            {
                Directory.Delete(imagesDirectory, true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting educational card images: {ex.Message}");
            }
        }
        
        if (Directory.Exists(attachmentsDirectory))
        {
            try
            {
                Directory.Delete(attachmentsDirectory, true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting educational card attachments: {ex.Message}");
            }
        }
        
        return true;
    }

    public EducationalDataResponse UpdateEducationalData(EducationalCardDataRequest dataRequest)
    {
        return AddEducationalData(dataRequest); 
    }
    
    public async Task<EducationalDataResponse> UpdateEducationalDataAsync(EducationalCardDataRequest dataRequest)
    {
        return await AddEducationalDataAsync(dataRequest);
    }

    public EducationalDataResponse GetEducationalData(int cardId)
    {
        var educationalCard = dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefault(ec => ec.Id == cardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Educational card data not found for the given card ID."
            };
        }

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }
    
    public async Task<EducationalDataResponse> GetEducationalDataAsync(int cardId)
    {
        var educationalCard = await dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefaultAsync(ec => ec.Id == cardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Educational card data not found for the given card ID."
            };
        }

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }
}
