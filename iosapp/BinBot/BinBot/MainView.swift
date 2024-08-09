//
//  MainView.swift
//  BinBot
//
//  Created by Sbeve on 02/08/2024.
//

import SwiftUI

struct MainView: View {
    @Binding var UserId: String
    var body: some View {
        TabView {
            NextCollectionVew(UserId: $UserId)
                .tabItem {
                    Label("Next Collection", systemImage: "truck.box.badge.clock.fill")
                }
            
            UpcomingCollectionView(UserId: $UserId)
                .tabItem {
                    Label("Future Collections", systemImage: "calendar.badge.clock")
                }
            
            SettingsView(UserId: $UserId)
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                
        }
    }
}


struct UpcomingCollectionView: View {
    @Binding var UserId: String
    @Environment(\.colorScheme) var colorScheme
    var body: some View {
        NavigationView {
            VStack {
                ZStack(alignment :.leading) {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(.cardColour)
                    HStack {
                        Image("bin-garden")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(height: 85)
                            .padding(.trailing, 10)
                        VStack {
                            Text("Garden Waste")
                                .font(.headline)
                            Text("• 13th November")
                                .padding(.leading, 5)
                            Text("• 20th November")
                                .padding(.leading, 5)
                            Text("• 27th November")
                                .padding(.leading, 5)
                        }
                    }
                    .padding()
                }
                .frame(height: /*@START_MENU_TOKEN@*/100/*@END_MENU_TOKEN@*/)
                
                Spacer().frame(height: 40)
                
                ZStack(alignment :.leading) {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(.cardColour)
                    HStack {
                        Image("bin-food")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(height: 85)
                            .padding(.trailing, 10)
                        VStack {
                            Text("Food Waste")
                                .font(.headline)
                            Text("• 13th November")
                                .padding(.leading, 5)
                            Text("• 20th November")
                                .padding(.leading, 5)
                            Text("• 27th November")
                                .padding(.leading, 5)
                        }
                    }
                    .padding()
                }.frame(height: 100)
                
                Spacer().frame(height: 40)
                
                ZStack(alignment :.leading) {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(.cardColour)
                    HStack {
                        Image("bin-general")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(height: 85)
                            .padding(.trailing, 10)
                        VStack {
                            Text("Household Waste")
                                .font(.headline)
                            Text("• 13th November")
                                .padding(.leading, 5)
                            Text("• 20th November")
                                .padding(.leading, 5)
                            Text("• 27th November")
                                .padding(.leading, 5)
                        }
                    }
                    .padding()
                }
                .frame(height: 100)
                
                Spacer().frame(height: 40)
                
                ZStack(alignment :.leading) {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(.cardColour)
                    HStack {
                        Image("bin-recyle")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(height: 85)
                            .padding(.trailing, 10)
                        VStack {
                            Text("Garden Waste")
                                .font(.headline)
                            Text("• 13th November")
                                .padding(.leading, 5)
                            Text("• 20th November")
                                .padding(.leading, 5)
                            Text("• 27th November")
                                .padding(.leading, 5)
                        }
                    }
                    .padding()
                }
                .frame(height: /*@START_MENU_TOKEN@*/100/*@END_MENU_TOKEN@*/)
                
                Spacer().frame(height: 40)

            }
            .padding()
            .navigationTitle(Text("Upcoming Collections"))
        }
    }
}

struct SettingsView: View {
    @Binding var UserId: String
    @AppStorage("email") var email: String = ""
    @AppStorage("firstName") var firstName: String = ""
    @AppStorage("lastName") var lastName: String = ""
    var body: some View {
        VStack {
            Image(systemName: "gear")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hi \(firstName) \(lastName) 👋!")
            Button("LogOut") {
                withAnimation {
                    UserId = ""
                }
            }
        }
        .padding()
    }
}



#Preview {
    BaseView()
}
