project_path = 'ios/App/App.xcodeproj/project.pbxproj'
content = File.read(project_path)

# Regex patterns to remove problematic blocks
# 1. Remove the PBXBuildFile reference
content.gsub!(/.*CapApp-SPM in Frameworks.*\n/, '')

# 2. Remove the XCLocalSwiftPackageReference block
content.gsub!(/\s*[A-Z0-9]+ \/\* XCLocalSwiftPackageReference "CapApp-SPM" \*\/ = \{[^}]+\};/, '')

# 3. Remove the XCSwiftPackageProductDependency block (the product reference)
content.gsub!(/\s*[A-Z0-9]+ \/\* CapApp-SPM \*\/ = \{[^}]+\};/, '')

# 4. Remove it from package references list in root object (PBXProject)
content.gsub!(/\s*[A-Z0-9]+ \/\* XCLocalSwiftPackageReference "CapApp-SPM" \*\/,/, '')

File.write(project_path, content)
puts "✂️ Aggressively pruned CapApp-SPM text from project.pbxproj"
