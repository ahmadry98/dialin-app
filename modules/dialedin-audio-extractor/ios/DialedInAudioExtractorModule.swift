import AVFoundation
import ExpoModulesCore

public class DialedInAudioExtractorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DialedInAudioExtractor")

    AsyncFunction("extractM4A") { (sourceUri: String, promise: Promise) in
      guard let sourceURL = URL(string: sourceUri) else {
        promise.reject("E_INVALID_SOURCE", "The shot video URI is invalid.")
        return
      }

      let asset = AVURLAsset(url: sourceURL)
      guard asset.tracks(withMediaType: .audio).isEmpty == false else {
        promise.reject("E_NO_AUDIO", "This video does not contain an audio track.")
        return
      }

      guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
        promise.reject("E_EXPORT_UNAVAILABLE", "Audio extraction is unavailable for this video.")
        return
      }

      let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      let outputURL = directory.appendingPathComponent("dialedin-shot-\(UUID().uuidString).m4a")
      exporter.outputURL = outputURL
      exporter.outputFileType = .m4a
      exporter.exportAsynchronously {
        switch exporter.status {
        case .completed:
          promise.resolve(outputURL.absoluteString)
        case .failed, .cancelled:
          promise.reject("E_EXPORT_FAILED", exporter.error?.localizedDescription ?? "Could not extract audio from this video.")
        default:
          promise.reject("E_EXPORT_FAILED", "Could not extract audio from this video.")
        }
      }
    }
  }
}
