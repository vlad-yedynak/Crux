using Crux.Data;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Crux.Models.Cards;

namespace Crux.Services;

public class EducationalDataService(ApplicationDbContext dbContext,
    IWebHostEnvironment webHostEnvironment,
    IS3StorageService s3StorageService) : IEducationalDataService
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
            var s3FolderPath = $"uploads/images/educational-cards/{educationalCard.Id}";

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

                        var fileName = $"{Guid.NewGuid()}{extension}";
                        var s3Url = await s3StorageService.UploadFileAsync(imageResponse ,s3FolderPath, fileName);
                        
                        
                        cardImages.Add(new CardImage
                        {
                            Url = s3Url,
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
            var s3FolderPath = $"uploads/attachments/educational-cards/{educationalCard.Id}";

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
                        var s3Url = await s3StorageService.UploadFileAsync(fileBytes, s3FolderPath, serverFileName);
                        
                        cardAttachment.Add(new CardAttachment
                        {
                            Url = s3Url,
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
    
    public async Task<bool> DeleteEducationalCardFilesAsync(int cardId)
    {
        var imagesFolder = $"uploads/images/educational-cards/{cardId}";
        var attachmentsFolder = $"uploads/attachments/educational-cards/{cardId}";
    
        try
        {
            await s3StorageService.DeleteFolderAsync(imagesFolder);
            await s3StorageService.DeleteFolderAsync(attachmentsFolder);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting S3 files for educational card {cardId}: {ex.Message}");
            return false;
        }
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
